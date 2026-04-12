# SkillForge Academy Portal Deployment

This repository contains the core infrastructure for the 2026 Virtual Mastery Season.

## 🚀 Quick Start
1. **Repository Setup**:
   ```bash
   git init
   git add .
   git commit -m "Initialize SkillForge Academy Portal v1.9.0"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Firebase Deployment**:
   - Ensure `firebase-tools` is installed: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize (if needed): `firebase init` (Select Hosting, Firestore)
   - Deploy: `firebase deploy`

## 🛡️ External Service Verification

### 1. Supabase (Avatar Storage)
**Checklist**:
- [ ] Go to **Storage** -> **Buckets**.
- [ ] Create/Ensure a bucket named `avatars`.
- [ ] Set Privacy to **Public**.
- [ ] In **Policies**, allow `INSERT` for authenticated/anon users and `SELECT` for everyone.
- [ ] **Verification Code** (Run in Browser Console):
```javascript
const { data, error } = await supabase.storage.from('avatars').list();
if (error) console.error("Supabase Storage Error:", error);
else console.log("Supabase Connection Successful:", data);
```

### 2. Cloudinary (Image Optimization)
**Checklist**:
- [ ] Log in to Cloudinary Console.
- [ ] Go to **Settings** -> **Upload**.
- [ ] Scroll to **Upload Presets** and ensure "Unsigned" uploading is handled via API fetch if needed.
- [ ] Go to **Settings** -> **Security**.
- [ ] In **Restricted Media Types**, ensure "Fetch" is **Enabled**.
- [ ] Add `supabase.co` to the **Allowed Fetch Domains** list.
- [ ] **Verification Link**:
`https://res.cloudinary.com/<your-cloud-name>/image/fetch/w_100/https://luxubaqztmbcpskyfgdp.supabase.co/storage/v1/object/public/avatars/test.jpg`
(Replace `<your-cloud-name>` with `db8pknwmz`)

### 3. Firebase (Identity & Registry)
**Checklist**:
- [ ] Go to **Authentication** -> **Settings**.
- [ ] Enable **Anonymous** and **Email/Password** providers.
- [ ] Add your production domain to the **Authorized Domains** list.
- [ ] Go to **Firestore** -> **Rules** and paste the contents of `firestore.rules`.
