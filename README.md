# Amplify React Quickstart Project

This project follows the AWS Amplify React quickstart pattern:
- React frontend (Vite)
- Amplify Gen 2 backend (`amplify/` directory)
- Hosting pipeline config (`amplify.yml`)

## Local run

```bash
npm install
npm run dev
```

## Deploy with Amplify Hosting

1. Push this project to a Git provider (GitHub/GitLab/Bitbucket).
2. In AWS Amplify Console, choose **New app** > **Host web app**.
3. Connect your repo and branch.
4. Keep `amplify.yml` as the build spec and deploy.
5. After first deploy finishes, download `amplify_outputs.json` from Amplify Console and replace the placeholder file in this repo.
6. Commit and push that update, then redeploy.

## Optional local backend sandbox

```bash
npm run amplify:sandbox
```

This creates an ephemeral backend environment for local development.
# AWS-Amplify-DEMO
