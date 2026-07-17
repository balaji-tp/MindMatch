const users = [];
const scores = [];
let nextUserId = 1;
let nextScoreId = 1;

export function createUser({ name, email, password }) {
  const user = {
    id: String(nextUserId++),
    name,
    email,
    password
  };
  users.push(user);
  return user;
}

export function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  return users.find((user) => user.id === id);
}

export function createScore({ userId, points, moves, seconds, difficulty }) {
  const score = {
    id: String(nextScoreId++),
    user: userId,
    points,
    moves,
    seconds,
    difficulty,
    createdAt: new Date().toISOString()
  };
  scores.push(score);
  return score;
}

export function getScoresByUser(userId) {
  return scores
    .filter((score) => score.user === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
}

export function getLeaderboard() {
  return scores
    .slice()
    .sort((a, b) => b.points - a.points || a.seconds - b.seconds)
    .slice(0, 10)
    .map((score) => ({
      ...score,
      user: findUserById(score.user)
    }));
}
