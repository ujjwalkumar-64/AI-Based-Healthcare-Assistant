import mongoose from 'mongoose';
const adminSchema = new mongoose.Schema({
    permissions: {
        type: [String],
        enum: ['manage_users', 'manage_content', 'view_reports'],
        required: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin'],
        required: true
    }
});

export const Admin = mongoose.model('Admin', adminSchema);

