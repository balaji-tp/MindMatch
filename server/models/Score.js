import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
  moves: { type: Number, required: true },
  seconds: { type: Number, required: true },
  difficulty: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);
export default Score;
