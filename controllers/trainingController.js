const Training = require('../models/trainingModel');
const User = require('../models/userModel');

// Get all pending trainings
exports.getPendingTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching pending trainings:', error);
    res.status(500).json({ message: 'Error fetching pending trainings', error: error.message });
  }
};

// Get all trainings (for dashboard)
exports.getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ message: 'Error fetching trainings', error: error.message });
  }
};

// Get training by ID
exports.getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }
    res.json(training);
  } catch (error) {
    console.error('Error fetching training:', error);
    res.status(500).json({ message: 'Error fetching training', error: error.message });
  }
};

// Create new training
exports.createTraining = async (req, res) => {
  try {
    const { employeeId, employeeName, trainingType, trainer, date, time, location } = req.body;

    const training = new Training({
      employeeId,
      employeeName,
      trainingType,
      trainer: trainer || '',
      date: date || '',
      time: time || '',
      location: location || ''
    });

    await training.save();
    res.status(201).json({ message: 'Training created successfully', training });
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ message: 'Error creating training', error: error.message });
  }
};

// Schedule training
exports.scheduleTraining = async (req, res) => {
  try {
    const { employeeId, employeeName, trainingType, trainer, date, time, location } = req.body;

    const training = await Training.findByIdAndUpdate(
      req.params.id,
      {
        employeeId,
        employeeName,
        trainingType,
        trainer,
        date,
        time,
        location,
        status: 'scheduled',
        scheduledAt: new Date()
      },
      { new: true }
    );

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ message: 'Training scheduled successfully', training });
  } catch (error) {
    console.error('Error scheduling training:', error);
    res.status(500).json({ message: 'Error scheduling training', error: error.message });
  }
};

// Assign trainer to training
exports.assignTrainer = async (req, res) => {
  try {
    const { trainer } = req.body;

    const training = await Training.findByIdAndUpdate(
      req.params.id,
      { trainer },
      { new: true }
    );

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ message: 'Trainer assigned successfully', training });
  } catch (error) {
    console.error('Error assigning trainer:', error);
    res.status(500).json({ message: 'Error assigning trainer', error: error.message });
  }
};

// Update training progress
exports.updateProgress = async (req, res) => {
  try {
    const { progress, notes } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    const updateData = {
      progress,
      notes: notes || ''
    };

    // If progress reaches 100%, mark as completed
    if (progress === 100) {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    } else if (progress > 0) {
      updateData.status = 'in-progress';
    }

    const training = await Training.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ message: 'Training progress updated successfully', training });
  } catch (error) {
    console.error('Error updating training progress:', error);
    res.status(500).json({ message: 'Error updating training progress', error: error.message });
  }
};

// Complete training
exports.completeTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ message: 'Training completed successfully', training });
  } catch (error) {
    console.error('Error completing training:', error);
    res.status(500).json({ message: 'Error completing training', error: error.message });
  }
};

// Delete training
exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({ message: 'Error deleting training', error: error.message });
  }
};

// Get trainings by employee ID
exports.getTrainingsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const trainings = await Training.find({ employeeId }).sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings by employee:', error);
    res.status(500).json({ message: 'Error fetching trainings by employee', error: error.message });
  }
};

// Get trainings by status
exports.getTrainingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const trainings = await Training.find({ status }).sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings by status:', error);
    res.status(500).json({ message: 'Error fetching trainings by status', error: error.message });
  }
};
