export function getWorkflowIdFromURL(url: string): string | undefined {
  // Matches both:
  // - .../workflows/:workflowId
  // - .../workflows/:workflowId/jobs/:buildNumber
  const match = url.match(/\/workflows\/([\w-]+)/);
  return match ? match[1] : undefined;
}
