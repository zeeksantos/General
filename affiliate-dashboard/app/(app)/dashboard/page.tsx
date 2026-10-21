import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>
          Connect your Facebook Page and Instagram account to see your top videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Connecting accounts arrives in the next phase.
      </CardContent>
    </Card>
  );
}
