import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = 'guest';
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    req.userId = payload.userId || 'guest';
    next();
  } catch (error) {
    req.userId = 'guest';
    next();
  }
};

export default auth;
