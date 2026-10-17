// ============================================================
//  Kamran Ali Portfolio – Node.js / Express Backend
//  Run:  node server.js
//  Open: http://localhost:3000
// ============================================================

const express    = require('express');
const nodemailer = require('nodemailer');
const path       = require('path');
const fs         = require('fs');

// Load environment variables from .env file if present
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/(^['"]|['"]$)/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Serve the front-end files from /public ──────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── CORS headers ─────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ============================================================
//  ROUTE 1 – List all available documents
//  GET /api/documents
// ============================================================
app.get('/api/documents', (req, res) => {
  let docsDir = path.join(__dirname, 'documents');
  if (!fs.existsSync(docsDir) || fs.readdirSync(docsDir).length === 0) {
    const publicDocs = path.join(__dirname, 'public', 'documents');
    if (fs.existsSync(publicDocs)) {
      docsDir = publicDocs;
    }
  }

  if (!fs.existsSync(docsDir)) {
    return res.json({ success: true, documents: [] });
  }

  const files = fs.readdirSync(docsDir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  const documents = files.map((file, index) => ({
    id:          index + 1,
    name:        path.basename(file, path.extname(file))
                     .replace(/[-_]/g, ' ')
                     .replace(/\b\w/g, c => c.toUpperCase()),
    type:        path.extname(file).replace('.', '').toUpperCase(),
    url:         `/api/documents/${encodeURIComponent(file)}`,
    downloadUrl: `/api/documents/${encodeURIComponent(file)}?download=true`,
  }));

  res.json({ success: true, documents });
});

// ============================================================
//  ROUTE 2 – Serve / Download a single document
//  GET /api/documents/:filename
// ============================================================
app.get('/api/documents/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  let filePath = path.join(__dirname, 'documents', safeName);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'documents', safeName);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Document not found.' });
  }

  const ext = path.extname(safeName).toLowerCase();
  const mimeMap = {
    '.pdf':  'application/pdf',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.webp': 'image/webp',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';

  if (req.query.download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  }

  res.setHeader('Content-Type', mime);
  fs.createReadStream(filePath).pipe(res);
});

// ============================================================
//  ROUTE 3 – Contact info
//  GET /api/contact
// ============================================================
app.get('/api/contact', (req, res) => {
  res.json({
    success: true,
    contact: {
      name:     'Kamran Ali',
      title:    'QA/QC Civil Engineer',
      location: 'Rawalpindi, Pakistan',
      phone: {
        display: '+92 303 0157596',
        href:    'tel:+923030157596',
      },
      email: {
        display: 'engr.kamranali810@gmail.com',
        href:    'mailto:engr.kamranali810@gmail.com',
      },
      availability: 'Open to Gulf Region Opportunities',
    }
  });
});

// ============================================================
//  ROUTE 4 – Handle contact form submission
//  POST /api/contact/send
//  Body: { name, email, subject, message }
// ============================================================
app.post('/api/contact/send', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
  }

  try {
    // ── EMAIL SETUP ─────────────────────────────────────────
    // STEP 1: Replace YOUR_APP_PASSWORD with your 16-digit app password
    // STEP 2: Save the file
    // STEP 3: Restart the server with: node server.js
    // ────────────────────────────────────────────────────────
    const emailUser = process.env.EMAIL_USER || 'ehsanali5584@gmail.com';
    const emailPass = process.env.EMAIL_PASS || '';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${emailUser}>`,
      to:   emailUser,
      subject: `Portfolio Contact: ${subject || 'New Message'}`,
      text: `New message from Kamran Ali's portfolio website:\n\nName:    ${name}\nEmail:   ${email}\nSubject: ${subject || '(none)'}\n\nMessage:\n${message}`
    });

    console.log(`\n📩 Email sent successfully from ${name} (${email})`);

  } catch (err) {
    console.error('❌ Email error:', err.message);
    // Still return success to visitor so they know message was received
  }

  // Always log to console as backup
  console.log('\n📩 New contact form submission:');
  console.log(`   Name:    ${name}`);
  console.log(`   Email:   ${email}`);
  console.log(`   Subject: ${subject || '(none)'}`);
  console.log(`   Message: ${message}\n`);

  res.json({
    success: true,
    message: 'Message received! Kamran will get back to you soon.'
  });
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Server running at http://localhost:${PORT}`);
  console.log(`📁  Put your PDFs/images in the  /documents  folder`);
  console.log(`🌐  Front-end served from        /public\n`);
});
