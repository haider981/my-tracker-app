const prisma = require('../config/prisma');

// Get all abbreviations by type and segment
const getAbbreviations = async (req, res) => {
  try {
    const { type, segment } = req.query;
    
    if (!type || !segment) {
      return res.status(400).json({
        success: false,
        message: 'Type and segment are required parameters'
      });
    }

    const abbreviations = await prisma.abbreviations.findMany({
      where: {
        type: type,
        segment: segment
      },
      orderBy: {
        full_name: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: abbreviations
    });
  } catch (error) {
    console.error('Error fetching abbreviations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all abbreviations grouped by type for a specific segment
const getAllAbbreviationsBySegment = async (req, res) => {
  try {
    const { segment } = req.params;
    
    if (!segment) {
      return res.status(400).json({
        success: false,
        message: 'Segment is required'
      });
    }

    const abbreviations = await prisma.abbreviations.findMany({
      where: {
        segment: segment
      },
      orderBy: [
        { type: 'asc' },
        { full_name: 'asc' }
      ]
    });
    
    // Group by type
    const groupedData = {};
    abbreviations.forEach(item => {
      if (!groupedData[item.type]) {
        groupedData[item.type] = [];
      }
      groupedData[item.type].push({
        id: item.id,
        full: item.full_name,
        abbr: item.abbreviation
      });
    });
    
    res.status(200).json({
      success: true,
      data: groupedData
    });
  } catch (error) {
    console.error('Error fetching abbreviations by segment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add new abbreviation
const addAbbreviation = async (req, res) => {
  try {
    const { full_name, abbreviation, type, segment } = req.body;
    
    if (!full_name || !abbreviation || !type || !segment) {
      return res.status(400).json({
        success: false,
        message: 'Full name, abbreviation, type, and segment are required'
      });
    }

    // Check if abbreviation already exists for this type and segment
    const existing = await prisma.abbreviations.findFirst({
      where: {
        abbreviation: abbreviation.trim(),
        type: type,
        segment: segment
      }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Abbreviation already exists for this type and segment'
      });
    }

    const newAbbreviation = await prisma.abbreviations.create({
      data: {
        full_name: full_name.trim(),
        abbreviation: abbreviation.trim(),
        type: type,
        segment: segment
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Abbreviation added successfully',
      data: newAbbreviation
    });
  } catch (error) {
    console.error('Error adding abbreviation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update abbreviation
const updateAbbreviation = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, abbreviation } = req.body;
    
    if (!full_name || !abbreviation) {
      return res.status(400).json({
        success: false,
        message: 'Full name and abbreviation are required'
      });
    }

    // Check if the abbreviation exists and get current values
    const existing = await prisma.abbreviations.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Abbreviation not found'
      });
    }

    // Check if new abbreviation conflicts with existing ones (excluding current record)
    const conflict = await prisma.abbreviations.findFirst({
      where: {
        abbreviation: abbreviation.trim(),
        type: existing.type,
        segment: existing.segment,
        id: { not: parseInt(id) }
      }
    });
    
    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Abbreviation already exists for this type and segment'
      });
    }

    const updatedAbbreviation = await prisma.abbreviations.update({
      where: { id: parseInt(id) },
      data: {
        full_name: full_name.trim(),
        abbreviation: abbreviation.trim()
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Abbreviation updated successfully',
      data: updatedAbbreviation
    });
  } catch (error) {
    console.error('Error updating abbreviation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Abbreviation not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete abbreviation
const deleteAbbreviation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the abbreviation exists
    const existing = await prisma.abbreviations.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Abbreviation not found'
      });
    }

    await prisma.abbreviations.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Abbreviation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting abbreviation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Abbreviation not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAbbreviations,
  getAllAbbreviationsBySegment,
  addAbbreviation,
  updateAbbreviation,
  deleteAbbreviation
};
