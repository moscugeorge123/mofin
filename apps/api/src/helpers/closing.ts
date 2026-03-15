import mongoose from 'mongoose';

export function exitCleanup() {
  async function closeDatabaseConnection() {
    return mongoose.connection
      .close()
      .then(() => console.log('✅ MongoDB connection closed'))
      .catch((err) =>
        console.error('❌ Error closing MongoDB connection:', err),
      );
  }

  process.stdin.resume(); // so the program will not close instantly

  // do something when app is closing
  process.on('exit', closeDatabaseConnection);

  // catches ctrl+c event
  process.on('SIGINT', closeDatabaseConnection);

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', closeDatabaseConnection);
  process.on('SIGUSR2', closeDatabaseConnection);
}
