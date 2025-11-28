const API_URL = 'http://localhost:3000/api';

class DataManager {
    static async getReports() {
        try {
            const response = await fetch(`${API_URL}/reports`);
            if (!response.ok) throw new Error('Failed to fetch reports');
            return await response.json();
        } catch (error) {
            console.error('Error fetching reports:', error);
            return [];
        }
    }

    static async submitReport(formData) {
        try {
            const response = await fetch(`${API_URL}/reports`, {
                method: 'POST',
                body: formData // Send FormData directly for file upload
            });

            if (!response.ok) {
                throw new Error('Failed to submit report');
            }
            return await response.json();
        } catch (error) {
            console.error('Error submitting report:', error);
            return null;
        }
    }

    static async updateStatus(id, status) {
        try {
            const response = await fetch(`${API_URL}/reports/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update status');
            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            return false;
        }
    }

    static async getStats() {
        try {
            const response = await fetch(`${API_URL}/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }
}

class Utils {
    static formatDate(timestamp) {
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getStatusBadgeClass(status) {
        switch (status) {
            case 'Pending': return 'badge-pending';
            case 'Verified': return 'badge-verified';
            case 'Rejected': return 'badge-rejected';
            default: return 'badge-secondary';
        }
    }
}

// Handle Upload Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = uploadForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            const formData = new FormData();
            const imageInput = document.getElementById('imageInput');

            if (imageInput.files[0]) {
                formData.append('image', imageInput.files[0]);
            }

            formData.append('location', document.getElementById('location').value);
            formData.append('lat', document.getElementById('lat').value);
            formData.append('lng', document.getElementById('lng').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('reporterName', document.getElementById('reporterName').value);
            formData.append('reporterPhone', document.getElementById('reporterPhone').value);

            const result = await DataManager.submitReport(formData);

            const messageDiv = document.getElementById('message');
            messageDiv.classList.remove('hidden');

            if (result) {
                messageDiv.className = 'mt-4 p-4 rounded-lg text-center bg-green-100 text-green-700 border border-green-200';
                messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> Report submitted successfully!';
                uploadForm.reset();
                document.getElementById('preview').classList.add('hidden');
                document.getElementById('dropzone-content').classList.remove('hidden');
            } else {
                messageDiv.className = 'mt-4 p-4 rounded-lg text-center bg-red-100 text-red-700 border border-red-200';
                messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to submit report. Please try again.';
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    }
});
