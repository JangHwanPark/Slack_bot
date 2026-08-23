/** 값 뒤에 남는 마크다운 기호, 괄호, 구두점을 정리한다. */
function cleanValue(value) {
    return value
        .replace(/[*_`]+/g, '')
        .replace(/[\s.,;]+$/, '')
        .replace(/^<|>$/g, '')
        .trim();
}

/** patterns를 순서대로 시도해 처음 매칭된 캡처 그룹을 돌려준다. */
function extractField(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        const captured = match && match[1];

        if (captured) {
            const value = cleanValue(captured);
            if (value) {
                return value;
            }
        }
    }

    return null;
}

/**
 * 규칙 배열을 적용해 { field: value } 형태로 만든다.
 * 찾지 못한 필드는 결과에 포함하지 않는다.
 */
function extractFields(text, rules) {
    const entries = rules
        .map((rule) => [rule.field, extractField(text, rule.patterns)])
        .filter(([, value]) => value !== null);

    return Object.fromEntries(entries);
}

module.exports = { extractField, extractFields, cleanValue };
