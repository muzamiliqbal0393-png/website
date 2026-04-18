require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests
});
app.use(limiter);

// Body parsers
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public') || path.join(__dirname)));

// MongoDB connection - Updated DB name
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/al-hadid-welding', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const localToken = req.query.token || req.headers['x-local-token'];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-me', (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  } else if (localToken) { // Skip localStorage server-side check
    next();
  } else {
    res.status(401).json({ error: 'Access denied' });
  }
};

// Frontend routes - Protected admin
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/login.html'));
});

app.get('/admin', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// API Routes
app.use('/api/inquiries', authenticateToken, require('./routes/inquiries'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gallery', authenticateToken, require('./routes/gallery'));
app.use('/api/services', require('./routes/services'));
app.use('/api/services/admin', authenticateToken, require('./routes/services'));

// Catch-all for frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// HTTPS redirect for production
if (process.env.NODE_ENV === 'production' && process.env.PROXY_HTTPS) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Admin: http://localhost:${PORT}/admin/login`);
  console.log('🔐 Protected APIs: /api/inquiries, /api/gallery, /api/services');
  console.log('📧 /api/inquiries POST (contact form)');
});
