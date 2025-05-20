// Create a new file named validateAnnouncement.js in your middleware directory

// Middleware to validate announcement data
exports.validateAnnouncement = (req, res, next) => {
  const { title, content, importance } = req.body;
  const errors = [];

  // Validate title
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  } else if (title.length > 100) {
    errors.push('Title cannot be more than 100 characters');
  }

  // Validate content
  if (!content || content.trim() === '') {
    errors.push('Content is required');
  }

  // Validate importance
  if (importance && !['low', 'medium', 'high'].includes(importance)) {
    errors.push('Importance must be low, medium, or high');
  }

  // Check for expiry date format if provided
  if (req.body.expiresAt) {
    const expiresAt = new Date(req.body.expiresAt);
    if (isNaN(expiresAt.getTime())) {
      errors.push('Invalid expiry date format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Export the middleware
module.exports.validateAnnouncementUpdate = (req, res, next) => {
  // For updates, we only validate fields that are provided
  const { title, content, importance, expiresAt } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (title.trim() === '') {
      errors.push('Title cannot be empty');
    } else if (title.length > 100) {
      errors.push('Title cannot be more than 100 characters');
    }
  }

  if (content !== undefined && content.trim() === '') {
    errors.push('Content cannot be empty');
  }

  if (importance !== undefined && !['low', 'medium', 'high'].includes(importance)) {
    errors.push('Importance must be low, medium, or high');
  }

  if (expiresAt !== undefined) {
    if (expiresAt !== null) {
      const date = new Date(expiresAt);
      if (isNaN(date.getTime())) {
        errors.push('Invalid expiry date format');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};