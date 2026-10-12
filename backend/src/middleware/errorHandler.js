exports.notFound = (req, res) => res.status(404).json({ message: 'Endpoint not found.' });

exports.errorHandler = (err, req, res, next) => {
  const status = err.name === 'CastError' ? 400 : err.status || 500;
  const message = err.name === 'CastError' ? 'Invalid restaurant id.' : err.message || 'Server error.';
  res.status(status).json({ message });
};
