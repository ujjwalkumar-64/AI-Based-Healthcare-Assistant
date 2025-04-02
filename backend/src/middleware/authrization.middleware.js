const authorizeRole = (roles) => {
    return async (req, res, next) => {
        const { user } = req;   
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have the required permissions' });
        }

        next();   
    };
};

export  { authorizeRole };
