export function getNestedValue(obj, path) {
    if (!path) return obj;
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (current === null || typeof current !== 'object') {
            return undefined;
        }
        if (part.includes('[') && part.includes(']')) {
            const arrayName = part.substring(0, part.indexOf('['));
            const indexStr = part.substring(part.indexOf('[') + 1, part.indexOf(']'));
            const index = parseInt(indexStr);
            if (arrayName) {
                current = current[arrayName];
                if (current === null || typeof current !== 'object' || !Array.isArray(current)) {
                    return undefined;
                }
            }
            current = current[index];
        } else {
            current = current[part];
        }
    }
    return current;
}
