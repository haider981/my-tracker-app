const prisma = require('../config/prisma'); 

const getAbbreviationsBySegment = async (req, res) => {
    try {
        const { segment } = req.params;
        
        if (!segment) {
            return res.status(400).json({
                success: false,
                message: 'Segment parameter is required'
            });
        }

        const validSegments = ['VK', 'FK', 'UNI'];
        if (!validSegments.includes(segment.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid segment. Must be VK, FK, or UNI'
            });
        }

        if (!prisma || !prisma.abbreviations) {
            console.error('Prisma client or abbreviations model not available');
            return res.status(500).json({
                success: false,
                message: 'Database connection error'
            });
        }

        // First, let's see what fields are actually in your database
        const sampleData = await prisma.abbreviations.findFirst({
            where: {
                segment: segment.toUpperCase()
            }
        });
        
        console.log('Sample database record:', sampleData);
        console.log('Available fields:', Object.keys(sampleData || {}));

        // Fetch all abbreviations for the given segment - get ALL fields first
        const abbreviations = await prisma.abbreviations.findMany({
            where: {
                segment: segment.toUpperCase()
            }
            // Don't use select first, get everything to see what's available
        });

        console.log(`Fetched ${abbreviations.length} abbreviations for segment ${segment}`);
        
        if (abbreviations.length > 0) {
            console.log('Sample abbreviation:', abbreviations[0]);
            console.log('Sample abbreviation fields:', Object.keys(abbreviations[0]));
        }

        if (abbreviations.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No abbreviations found for segment: ${segment}`,
                data: {
                    classSem: [],
                    board: [],
                    subject: [],
                    series: [],
                    medium: [],
                    session: []
                }
            });
        }

        // Group abbreviations by type
        const groupedData = {
            classSem: [],
            board: [],
            subject: [],
            series: [],
            medium: [],
            session: []
        };

        // Type mapping
        const typeMapping = {
            'classSem': 'classSem',
            'classem': 'classSem',
            'class': 'classSem',
            'semester': 'classSem',
            'sem': 'classSem',
            'board': 'board',
            'subject': 'subject',
            'series': 'series',
            'author': 'series',
            'medium': 'medium',
            'session': 'session'
        };

        abbreviations.forEach(abbrev => {
            let mappedType = typeMapping[abbrev.type];
            
            if (!mappedType) {
                mappedType = typeMapping[abbrev.type.toLowerCase()];
            }
            
            if (!mappedType) {
                const lowerType = abbrev.type.toLowerCase();
                if (lowerType.includes('class') || lowerType.includes('sem')) {
                    mappedType = 'classSem';
                } else if (lowerType.includes('board')) {
                    mappedType = 'board';
                } else if (lowerType.includes('subject')) {
                    mappedType = 'subject';
                } else if (lowerType.includes('series') || lowerType.includes('author')) {
                    mappedType = 'series';
                } else if (lowerType.includes('medium')) {
                    mappedType = 'medium';
                } else if (lowerType.includes('session')) {
                    mappedType = 'session';
                }
            }
            
            if (mappedType && groupedData[mappedType]) {
                // Check what field contains the full name
                const fullNameField = abbrev.fullName || abbrev.full_name || abbrev.name || abbrev.description || abbrev.abbreviation;
                
                console.log(`Processing ${abbrev.abbreviation}: fullName=${abbrev.fullName}, full_name=${abbrev.full_name}, name=${abbrev.name}`);
                
                groupedData[mappedType].push({
                    abbreviation: abbrev.abbreviation,
                    fullName: fullNameField, // Use whatever field has the full name
                    id: abbrev.id
                });
            }
        });

        // Sort each array alphabetically by abbreviation
        Object.keys(groupedData).forEach(key => {
            groupedData[key].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
        });

        console.log('Final grouped data sample:', {
            classSem: groupedData.classSem.slice(0, 2),
            board: groupedData.board.slice(0, 2),
            subject: groupedData.subject.slice(0, 2),
            series: groupedData.series.slice(0, 2)
        });

        res.status(200).json({
            success: true,
            message: `Abbreviations fetched successfully for segment: ${segment}`,
            data: groupedData
        });

    } catch (error) {
        console.error('Error fetching abbreviations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching abbreviations',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all segments available
const getAllSegments = async (req, res) => {
    try {
        // Check if prisma is available
        if (!prisma || !prisma.abbreviations) {
            console.error('Prisma client or abbreviations model not available');
            return res.status(500).json({
                success: false,
                message: 'Database connection error'
            });
        }

        const segments = await prisma.abbreviations.findMany({
            select: {
                segment: true
            },
            distinct: ['segment']
        });

        const segmentList = segments.map(s => s.segment).sort();

        res.status(200).json({
            success: true,
            message: 'Segments fetched successfully',
            data: segmentList
        });

    } catch (error) {
        console.error('Error fetching segments:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching segments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get abbreviation details by ID (optional utility function)
const getAbbreviationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const abbreviation = await prisma.abbreviations.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        if (!abbreviation) {
            return res.status(404).json({
                success: false,
                message: 'Abbreviation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Abbreviation fetched successfully',
            data: abbreviation
        });

    } catch (error) {
        console.error('Error fetching abbreviation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching abbreviation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


module.exports = {
    getAbbreviationsBySegment,
    getAllSegments,
    getAbbreviationById
};
