import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui/badge";

/**
 * Marker shell for routes whose implementation is owned by a future sprint.
 * Keeps the route reachable and the copy in English while signalling clearly
 * that the surface is stubbed.
 */
export function SprintStub({
  title,
  sprint,
  body,
}: {
  title: string;
  sprint: string;
  body?: string;
}) {
  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <Badge variant="terracotta">{sprint}</Badge>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            {body ??
              "This route is reserved. Implementation lands in the sprint above."}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
