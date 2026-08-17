// searchUtils.ts

import type { NextRouter } from "next/router";
import {
    CerebroExpression,
    CerebroField,
    OFFICIAL_ONLY,
    all,
    any,
    predicate,
    serializeCerebroQuery,
} from "@/api/cerebroQuery";

/** Free-text fields a search term is matched against. */
const TEXT_SEARCH_FIELDS: readonly CerebroField[] = ['rules', 'name', 'subname'];

export type SearchJoinOperator = 'and' | 'or';

const tokenizeSearchText = (searchText: string): string[] => {
    const tokens: string[] = [];
    const tokenPattern = /"([^"]+)"|(\S+)/g;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(searchText)) !== null) {
        const token = (match[1] ?? match[2]).trim();
        if (token) tokens.push(token);
    }

    return tokens;
};

/**
 * Builds a Cerebro expression for one term: any free-text field may match, and
 * traits may match too once punctuation and digits are stripped. Terms with no
 * letters contribute no trait clause rather than an empty one.
 */
const termExpression = (token: string): CerebroExpression => {
    const clauses: CerebroExpression[] = TEXT_SEARCH_FIELDS.map(field => predicate(field, token));
    const traitToken = token.replace(/[^\p{L}]/gu, '');

    if (traitToken) clauses.push(predicate('trait', traitToken));

    return any(...clauses);
};

/**
 * Serializes a user's search text into a Cerebro query. Values are escaped by
 * the shared query builder and the official-only predicate is always applied
 * here, so callers never choose a card origin.
 */
export const createSearchQuery = (
    searchString: string,
    joinOperator: SearchJoinOperator = 'and',
): string => {
    const terms = tokenizeSearchText(searchString).map(termExpression);
    const combined = joinOperator === 'and' ? all(...terms) : any(...terms);

    return serializeCerebroQuery(all(combined, OFFICIAL_ONLY));
};

export const handleSearch = (query: string, router: NextRouter) => {
    return router.push({
        pathname: '/search',
        query: { query },
    });
};
