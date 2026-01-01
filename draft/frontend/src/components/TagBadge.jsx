const TagBadge = ({ tag, onRemove, darkMode = false, size = 'md' }) => {
    const sizes = {
        sm: { fontSize: 11, padding: '3px 8px', height: 22 },
        md: { fontSize: 12, padding: '4px 10px', height: 26 },
        lg: { fontSize: 13, padding: '5px 12px', height: 30 },
    };

    const style = sizes[size] || sizes.md;

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: `${tag.color}15`,
                border: `1.5px solid ${tag.color}40`,
                color: tag.color,
                borderRadius: 20,
                fontSize: style.fontSize,
                fontWeight: 500,
                padding: style.padding,
                height: style.height,
                lineHeight: 1,
                transition: 'all 0.2s ease',
            }}
        >
            {tag.name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(tag.tagId);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: tag.color,
                        fontSize: 14,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                    aria-label={`Remove ${tag.name} tag`}
                >
                    ×
                </button>
            )}
        </span>
    );
};

export default TagBadge;
