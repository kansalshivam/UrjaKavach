# Deployed Production Playbook — Plan B (Oracle Cloud Always Free VM)

This playbook outlines the exact step-by-step instructions to deploy the Urja Kavach stack on an **Oracle Cloud Always Free** virtual machine. This setup runs your Docker-Compose stack unmodified, keeps the database secure, and configures automatic HTTPS routing using Caddy.

---

## Step 1: Provision the VM on Oracle Cloud

1.  Log in to your **Oracle Cloud Console**.
2.  Navigate to **Compute** -> **Instances** -> **Create Instance**.
3.  Configure the instance settings:
    *   **Name:** `urja-kavach-production`
    *   **Image:** Select **Ubuntu 22.04 LTS** (default is Oracle Linux; Ubuntu is highly recommended for simpler Docker setups).
    *   **Shape:** 
        *   *Option 1 (Recommended):* Select **Ampere (Arm)** with **1 OCPU** and **6 GB RAM** (Always Free Eligible).
        *   *Option 2 (Fallback):* Select **VM.Standard.E2.1.Micro (AMD)** with **1 OCPU** and **1 GB RAM** (Always Free Eligible).
    *   **Networking:** Ensure it is assigned to a Public Subnet with a Public IP address.
    *   **SSH Keys:** Generate a key pair and download both the private and public keys.
4.  Click **Create** and wait for the instance status to show **Running**. Note your **Public IP Address**.

---

## Step 2: Configure Oracle Cloud Firewall (Security Lists)

By default, Oracle Cloud blocks all inbound traffic. You must allow traffic on HTTP and HTTPS ports:

1.  From the Instance Details page, click on your **Virtual Cloud Network (VCN)** link.
2.  Click on **Security Lists** in the left menu, then click on your **Default Security List**.
3.  Click **Add Ingress Rules** and configure two rules:
    *   **Rule 1 (HTTP):**
        *   **Source CIDR:** `0.0.0.0/0`
        *   **IP Protocol:** `TCP`
        *   **Destination Port Range:** `80`
    *   **Rule 2 (HTTPS):**
        *   **Source CIDR:** `0.0.0.0/0`
        *   **IP Protocol:** `TCP`
        *   **Destination Port Range:** `443`
4.  *Security Note:* Do **NOT** open port `5433` (Postgres) or `8000` (API) in the Security List. They should only be accessible internally within the Docker bridge network.

---

## Step 3: Install Docker & Caddy on the VM

1.  SSH into your newly provisioned VM using your terminal:
    ```bash
    ssh -i /path/to/your/ssh-key.key ubuntu@<YOUR_VM_PUBLIC_IP>
    ```
2.  Update the system and install Docker / Docker Compose:
    ```bash
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y docker.io docker-compose-v2 curl
    sudo usermod -aG docker ubuntu
    ```
3.  Install Caddy (the reverse proxy that handles HTTPS automatically):
    ```bash
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy -y
    ```

---

## Step 4: Clone Repository & Configure Environment Variables

1.  Clone your GitHub repository on the VM:
    ```bash
    git clone https://github.com/kansalshivam/UrjaKavach.git /home/ubuntu/UrjaKavach
    cd /home/ubuntu/UrjaKavach
    ```
2.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Edit `.env` using your favorite text editor (e.g. `nano .env`) and add your production credentials:
    ```env
    POSTGRES_PASSWORD=your_super_secure_db_password
    POSTGRES_PORT=5433

    EIA_API_KEY=your_eia_api_key
    AISSTREAM_API_KEY=your_ais_api_key
    GEMINI_API_KEY=your_gemini_api_key
    GROQ_API_KEY=your_groq_api_key
    ```
    *(Note: Never commit your `.env` file to GitHub.)*

---

## Step 5: Configure Reverse Proxy (Caddyfile)

Create a configuration file to proxy incoming web traffic to the running containers:

1.  Open the default Caddyfile:
    ```bash
    sudo nano /etc/caddy/Caddyfile
    ```
2.  Replace the file contents with the following (if you do not have a custom domain name, use your public IP address; note that HTTPS requires a domain name):
    ```caddyfile
    # Replace with your actual domain name (e.g. urjakavach.com)
    # If using an IP address, change to: <YOUR_VM_PUBLIC_IP>
    your-domain.com {
        # Reverse proxy backend endpoints
        reverse_proxy /api/* 127.0.0.1:8000
        reverse_proxy /health 127.0.0.1:8000

        # Reverse proxy all other requests to the Vite frontend
        reverse_proxy * 127.0.0.1:5173
    }
    ```
3.  Restart Caddy to apply changes:
    ```bash
    sudo systemctl restart caddy
    ```

---

## Step 6: Start the Docker Stack & Seed Database

1.  Build and launch the containers:
    ```bash
    docker compose up --build -d
    ```
2.  Verify all three containers are healthy and running:
    ```bash
    docker compose ps
    ```
3.  Seed the production database with nodes, edges, active vessel counts, and risk scores:
    ```bash
    # Seeding graph nodes & edges
    docker compose exec api env PYTHONPATH=. python tests/reseed_network.py

    # Seeding vessel telemetry
    docker compose exec api env PYTHONPATH=. python tests/generate_live_data.py

    # Compute baseline risk scoring
    docker compose exec api env PYTHONPATH=. python tests/trigger_polls.py
    ```

---

## Step 7: Verify Production Site

Open your web browser and navigate to `https://your-domain.com`. 
*   Confirm the landing timeline scrolls correctly.
*   Log in and verify the Geopolitical Risk Dashboard displays populated weights and non-zero risk metrics.
*   Verify the Digital Twin Map markers pulsate orange/yellow with active derived risk.
