export default function mcpErrorOutput(text: string) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: text,
      },
    ],
  };
}
