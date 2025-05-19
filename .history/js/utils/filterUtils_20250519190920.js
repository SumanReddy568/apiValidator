export const operators = {
    equals: {
        label: 'equals',
        fn: (a, b) => String(a) === String(b)
    },
    contains: {
        label: 'contains',
        fn: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase())
    },
    startsWith: {
        label: 'starts with',
        fn: (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase())
    },
    endsWith: {
        label: 'ends with',
        fn: (a, b) => String(a).toLowerCase().endsWith(String(b).toLowerCase())
    },
    greaterThan: {
        label: 'greater than',
        fn: (a, b) => Number(a) > Number(b)
    },
    lessThan: {
        label: 'less than',
        fn: (a, b) => Number(a) < Number(b)
    }
};

export function applyFilters(data, filters) {
    if (!Array.isArray(data)) return data;
    
    return data.filter(item => {
        return filters.every(filter => {
            const value = getNestedValue(item, filter.path);
            return operators[filter.operator].fn(value, filter.value);
        });
    });
}

export function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
