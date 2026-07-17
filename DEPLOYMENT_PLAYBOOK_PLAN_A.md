# Deployed Production Playbook — Plan A (Genuinely Free Cloud Stack)

This playbook outlines the step-by-step instructions to deploy the Urja Kavach stack using **100% free-tier cloud services** that require **no credit card**.

*   **Database:** Neon Postgres (Permanently free tier, no card required)
*   **API Backend:** Render Web Service (Free tier, no card required)
*   **Frontend Web:** Vercel (Free tier static hosting, no card required)

---

## Step 1: Create a Free Database on Neon

1.  Go to [Neon.tech](https://neon.tech/) and sign up for a free account.
2.  Create a new project named `urja-kavach`. Select **PostgreSQL 16** and your preferred region.
3.  Once the project is created, copy the **connection string**. It will look similar to:
    ```
    postgresql://urjakavach_owner:npg_xYz1234@ep-cool-snowflake-a5uz1l2s.us-east-2.aws.neon.tech/neondb?sslmode=require
    ```
4.  To make this compatible with SQLAlchemy's async driver (`asyncpg`), change the prefix from `postgresql://` to `postgresql+asyncpg://`.
    *   *Example Connection String:*
        `postgresql+asyncpg://urjakavach_owner:npg_xYz1234@ep-cool-snowflake-a5uz1l2s.us-east-2.aws.neon.tech/neondb?sslmode=require`
    *   Save this URL; we will refer to this as your **`DATABASE_URL`**.

---

## Step 2: Deploy the API Backend on Render

1.  Go to [Render.com](https://render.com/) and sign up for a free account.
2.  Click **New +** in the top-right corner, then select **Web Service**.
3.  Connect your GitHub repository (`UrjaKavach`).
4.  Configure the service details:
    *   **Name:** `urjakavach-api`
    *   **Runtime:** `Docker`
    *   **Docker Build Context:** `api`
    *   **Dockerfile Path:** `Dockerfile` (Render will build the backend container automatically using the existing `api/Dockerfile`).
    *   **Instance Type:** **Free** ($0/month)
5.  Click on the **Environment** tab, then add the following variables:
    *   `DATABASE_URL` = *(Your connection string from Step 1)*
    *   `EIA_API_KEY` = *(Your EIA API Key)*
    *   `AISSTREAM_API_KEY` = *(Your AISstream API Key)*
    *   `GEMINI_API_KEY` = *(Your Gemini API Key)*
    *   `GROQ_API_KEY` = *(Your Groq API Key)*
6.  Click **Deploy Web Service** and wait for the deployment build logs to show `Uvicorn running on http://0.0.0.0:8000`.
7.  Copy your Render Web Service URL from the top of the dashboard (e.g. `https://urjakavach-api.onrender.com`).

---

## Step 3: Run Database Migrations and Seed Data (Locally)

Since Neon is a cloud database reachable over the public internet, you can easily apply migrations and run database seeds from your local computer:

1.  Open your terminal/PowerShell locally in `c:\Users\shiva\Downloads\UrjaKavach\api`.
2.  Set the `DATABASE_URL` in your environment and run the Alembic upgrade command:
    ```powershell
    $env:DATABASE_URL="postgresql+asyncpg://urjakavach_owner:npg_xYz1234@ep-cool-snowflake-a5uz1l2s.us-east-2.aws.neon.tech/neondb?sslmode=require"
    alembic upgrade head
    ```
3.  Seed the remote Neon database by running the seed commands from your local workspace:
    ```powershell
    # Seed nodes and edges graph topology
    python tests/reseed_network.py

    # Seed initial vessel telemetry
    python tests/generate_live_data.py

    # Run initial analytical calculations and scores
    python tests/trigger_polls.py
    ```

---

## Step 4: Configure Frontend Vercel JSON Redirects

1.  Open [web/vercel.json](file:///c:/Users/shiva/Downloads/UrjaKavach/web/vercel.json) in your code editor.
2.  Replace `https://urjakavach-api.onrender.com` with your actual Render API URL obtained in **Step 2 (Item 7)**.
3.  Save the file, stage, commit, and push it to your GitHub repository:
    ```bash
    git add web/vercel.json
    git commit -m "config: update production vercel backend url"
    git push
    ```

---

## Step 5: Deploy the Web Client on Vercel

1.  Go to [Vercel.com](https://vercel.com/) and sign up/log in.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository (`UrjaKavach`).
4.  Configure the project details:
    *   **Framework Preset:** **Vite** (Vercel detects this automatically).
    *   **Root Directory:** Select **`web`** (Click Edit and select the `web` sub-folder).
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
5.  Click **Deploy**.
6.  Once the build completes, Vercel will provide your public site URL (e.g. `https://urjakavach.vercel.app`).

---

## Step 6: Verify the Live Console

1.  Go to your Vercel deployment URL.
2.  Log in and navigate between screens.
3.  Check that the digital twin map is fully populated, and verified risk data propagates downstream.
