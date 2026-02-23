// searchUtils.ts

import { NextRouter } from "next/router";

const searchParameters = [
    'ru',
    'n',
    'sn',
    'tr'
];

export const createSearchQuery = (searchString: string, filterOptions: { origin: string }) => {
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
        let processedToken = token.replace(/"/g, '');
        const encodedToken = encodeURIComponent(processedToken);
        return searchParameters.map(param => {
            if (param === 'tr') {
                const trToken = encodeURIComponent(processedToken.replace(/[^a-zA-Z]/g, ''));
                return `${param}:"${trToken}"`;
            }
            return `${param}:"${encodedToken}"`;
        }).join('|');
    });

    // Combine query parts with OR operators
    const combinedQuery = queryParts.join('|');

    // Add the filter options to the query
    const filterQueries = [];
    if (filterOptions.origin !== "all") {
        filterQueries.push(`o:"${filterOptions.origin === "official"}"`);
    }

    // Final combined query with filters
    return `input=(${combinedQuery})${filterQueries.length > 0 ? '%26' + filterQueries.join('%26') : ''}`;
};

export const handleSearch = async (query: string, router: NextRouter, origin?: string) => {
    router.push(`/search?query=${encodeURIComponent(query)}&incomplete=true&origin=${origin}`);
};
