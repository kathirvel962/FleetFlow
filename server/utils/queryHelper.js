/**
 * Helper to paginate, filter, and search Mongoose queries
 * @param {import('mongoose').Model} model 
 * @param {Object} queryParams req.query object
 * @param {Object} options Configuration for search and populate
 */
const paginateQuery = async (model, queryParams = {}, options = {}) => {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const sort = queryParams.sort || options.defaultSort || "-createdAt";

    let filter = { ...(options.baseFilter || {}) };

    // Apply allowed direct filters from query parameters
    if (options.allowedFilters && Array.isArray(options.allowedFilters)) {
        options.allowedFilters.forEach((key) => {
            if (queryParams[key] !== undefined && queryParams[key] !== "") {
                filter[key] = queryParams[key];
            }
        });
    }

    // Apply search query across search fields if search string is provided
    if (queryParams.search && options.searchFields && Array.isArray(options.searchFields)) {
        const searchRegex = new RegExp(queryParams.search.trim(), "i");
        filter.$or = options.searchFields.map((field) => ({
            [field]: searchRegex
        }));
    }

    const total = await model.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;

    let query = model.find(filter).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
        if (Array.isArray(options.populate)) {
            options.populate.forEach((pop) => {
                query = query.populate(pop);
            });
        } else {
            query = query.populate(options.populate);
        }
    }

    if (options.select) {
        query = query.select(options.select);
    }

    const data = await query.exec();

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            pages
        }
    };
};

module.exports = {
    paginateQuery
};
