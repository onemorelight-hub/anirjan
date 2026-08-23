# Anirjan — Not Without People

> The world is filled with complete mess. Let's clean the mess — and build a better, safer world.

Anirjan is a brand dedicated to mindful mobile software, sustainable zero-microplastic physical hardware, and grassroots social initiatives.

---

## Deploying to Render (Free Static Site)

This project is a 100% static, fast, zero-build web application. You can deploy it to **Render** in 2 minutes:

### Method 1: Render Dashboard (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** → **Static Site**.
3. Connect your **`anirjan`** repository.
4. Set the following settings:
   - **Name**: `anirjan` (or any custom name)
   - **Branch**: `main` (or `master`)
   - **Build Command**: *(leave empty)*
   - **Publish Directory**: `.` (or `./`)
5. Click **Create Static Site**.
6. Render will instantly deploy your site at `https://anirjan.onrender.com`.

---

### Method 2: Automatic Blueprint (`render.yaml`)

This repository already contains a [`render.yaml`](./render.yaml) file.
1. In the Render Dashboard, click **New +** → **Blueprint**.
2. Select your repository.
3. Render will read `render.yaml` and deploy automatically.
