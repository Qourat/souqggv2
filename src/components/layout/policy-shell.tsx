import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export function PolicyShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container py-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated ? (
              <span className="label-mono">Updated · {lastUpdated}</span>
            ) : null}
            <Badge variant="terracotta">draft — review required</Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-3 text-sm leading-relaxed">
          {children ?? (
            <p className="text-muted-foreground">
              Final copy will be drafted with counsel before launch.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
