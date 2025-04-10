export default function mcpErrorOutput(text: string) {
  return {
    isError: true as const,
    content: [
      {
        type: 'text' as const,
        text: text,
      },
    ],
  };
}
