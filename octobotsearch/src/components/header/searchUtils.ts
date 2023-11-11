// searchUtils.ts

const searchParameters = [
    'ru',
    'cl',
    'n',
    'sn',
    'ty',
    'tr'
];

export const createSearchQuery = (searchString: string, filterOptions: { incomplete: boolean; origin: string }) => {
    // Use a regular expression to match phrases inside quotes or single words
    const regex = /"[^"]+"|\S+/g;
    const tokens = [];

    let match;
    while ((match = regex.exec(searchString)) !== null) {
        tokens.push(match[0]);
    }

    // Process each token
    const queryParts = tokens.map(token => {
        // Remove quotes for the current token if it's a phrase
        const processedToken = token.replace(/"/g, '');
        const encodedToken = encodeURIComponent(processedToken);
        return searchParameters.map(param => `${param}:"${encodedToken}"`).join('|');
    });

    // Combine query parts with OR operators
    const combinedQuery = queryParts.join('|');
    
    // Add the filter options to the query
    const filterQueries = [];
    if (!filterOptions.incomplete) {
        filterQueries.push(`i:"false"`);
    }
    if (filterOptions.origin !== "all") {
        filterQueries.push(`o:"${filterOptions.origin === "official"}"`);
    }
    
    // Final combined query with filters
    return `input=(${combinedQuery})${filterQueries.length > 0 ? '%26' + filterQueries.join('%26') : ''}`;
};
