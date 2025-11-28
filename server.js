const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Data Persistence Setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Initialize reports file if not exists
if (!fs.existsSync(REPORTS_FILE)) {
    // Seed with some initial data if empty
    const initialData = [
        {
            id: '1716881234567',
            imageUrl: 'https://images.unsplash.com/photo-1611288870280-4a331d941501?q=80&w=2574&auto=format&fit=crop',
            location: 'Central Park, Sector 4',
            lat: 28.6139,
            lng: 77.2090,
            description: 'Pile of plastic waste near the park entrance.',
            reporterName: 'Amit Sharma',
            reporterPhone: '9876543210',
            status: 'Pending',
            timestamp: 1716881234567,
            repeatCount: 1
        }
    ];
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read/write data
const getReports = () => {
    const data = fs.readFileSync(REPORTS_FILE);
    return JSON.parse(data);
};

const saveReports = (reports) => {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
};

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes

// GET /api/reports - Get all reports
app.get('/api/reports', (req, res) => {
    const reports = getReports();
    res.json(reports);
});

// GET /api/stats - Get statistics
app.get('/api/stats', (req, res) => {
    const reports = getReports();
    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'Pending').length,
        verified: reports.filter(r => r.status === 'Verified').length,
        rejected: reports.filter(r => r.status === 'Rejected').length
    };
    res.json(stats);
});

// POST /api/reports - Submit a new report
app.post('/api/reports', upload.single('image'), (req, res) => {
    try {
        const reports = getReports();
        const { location, lat, lng, description, reporterName, reporterPhone } = req.body;

        // Handle image URL
        let imageUrl = 'https://images.unsplash.com/photo-1611288870280-4a331d941501?q=80&w=2574&auto=format&fit=crop'; // Default
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        // Check for repeats
        const existingReports = reports.filter(r => r.reporterPhone === reporterPhone);

        const newReport = {
            id: Date.now().toString(),
            imageUrl,
            location,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            description,
            reporterName,
            reporterPhone,
            status: 'Pending',
            timestamp: Date.now(),
            repeatCount: existingReports.length
        };

        reports.unshift(newReport);
        saveReports(reports);

        res.status(201).json(newReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save report' });
    }
});

// PATCH /api/reports/:id/status - Update status
app.patch('/api/reports/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, problemType, forwardTo } = req.body;

    const reports = getReports();
    const reportIndex = reports.findIndex(r => r.id === id);

    if (reportIndex === -1) {
        return res.status(404).json({ error: 'Report not found' });
    }

    // Update fields if provided
    if (status) reports[reportIndex].status = status;
    if (problemType) reports[reportIndex].problemType = problemType;
    if (forwardTo) reports[reportIndex].forwardTo = forwardTo;

    saveReports(reports);

    res.json(reports[reportIndex]);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
