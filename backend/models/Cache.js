import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    source: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true},
 });

 // TTl index: MongoDB deletes the document automatically after expireAt
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('cache', cacheSchema);