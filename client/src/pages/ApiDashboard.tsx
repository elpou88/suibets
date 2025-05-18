import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const endpoints = [
  { name: 'BWin Inplay', url: '/api/betsbwin/live' },
  { name: 'BWin Upcoming', url: '/api/betsbwin/upcoming' },
  { name: 'BWin Sports', url: '/api/betsbwin/sports' },
  { name: 'BetsAPI Inplay', url: '/api/betsapi/live' },
  { name: 'BetsAPI Upcoming', url: '/api/betsapi/upcoming' },
  { name: 'BetsAPI Sports', url: '/api/betsapi/sports' },
  { name: 'Standard Events', url: '/api/events' },
  { name: 'Live Events', url: '/api/events/live' },
  { name: 'Live Events (Lite)', url: '/api/events/live-lite' },
  { name: 'API Status', url: '/api/status' },
];

// Endpoint testing dashboard to diagnose API access issues
export default function ApiDashboard() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('181477-ToriIDEJRGaxoz');
  const [customUrl, setCustomUrl] = useState('');
  const [sportId, setSportId] = useState('1');
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [customResponse, setCustomResponse] = useState<any>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customLoading, setCustomLoading] = useState(false);

  // Test a specific endpoint
  const testEndpoint = async (endpoint: string, name: string) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const queryParam = sportId ? `${endpoint.includes('?') ? '&' : '?'}sport_id=${sportId}` : '';
      const response = await fetch(`${endpoint}${queryParam}`);
      const data = await response.json();
      setResults(prev => ({ ...prev, [name]: data }));
      toast({
        title: `${name} Response`,
        description: response.ok 
          ? `Success: Found ${Array.isArray(data) ? data.length : 'data'}`
          : `Error: ${data.error || 'Unknown error'}`,
        variant: response.ok ? 'default' : 'destructive',
      });
    } catch (error: any) {
      setResults(prev => ({ ...prev, [name]: { error: error.message } }));
      toast({
        title: `${name} Error`,
        description: error.message || 'Failed to fetch',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  // Test a custom URL (direct to BetsAPI)
  const testCustomUrl = async () => {
    if (!customUrl) return;
    
    setCustomLoading(true);
    setCustomError(null);
    
    try {
      // Direct fetch to BetsAPI
      const urlWithToken = customUrl.includes('token=') 
        ? customUrl 
        : `${customUrl}${customUrl.includes('?') ? '&' : '?'}token=${apiKey}`;
      
      console.log('Testing custom URL:', urlWithToken);
      
      // We need to use a proxy here since we can't directly call BetsAPI from the browser
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlWithToken }),
      });
      
      const data = await response.json();
      setCustomResponse(data);
      
      if (data.error) {
        setCustomError(data.error + (data.error_detail ? `: ${data.error_detail}` : ''));
      }
    } catch (error: any) {
      setCustomError(error.message || 'Unknown error');
      setCustomResponse(null);
    } finally {
      setCustomLoading(false);
    }
  };

  // Format JSON for display
  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return 'Error formatting JSON';
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">API Access Dashboard</h1>
      
      <Tabs defaultValue="standard">
        <TabsList className="mb-4">
          <TabsTrigger value="standard">Standard Endpoints</TabsTrigger>
          <TabsTrigger value="custom">Custom Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sportId">Sport ID (Optional)</Label>
                <Input 
                  id="sportId" 
                  value={sportId} 
                  onChange={e => setSportId(e.target.value)}
                  placeholder="e.g. 1 for soccer/football"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endpoints.map((endpoint) => (
              <Card key={endpoint.name} className="p-4">
                <h3 className="font-bold text-lg mb-2">{endpoint.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 truncate">{endpoint.url}</p>
                <Button 
                  onClick={() => testEndpoint(endpoint.url, endpoint.name)}
                  disabled={loading[endpoint.name]}
                  className="w-full mb-4"
                >
                  {loading[endpoint.name] ? 'Testing...' : 'Test Endpoint'}
                </Button>
                
                {results[endpoint.name] && (
                  <div>
                    <h4 className="font-semibold mb-2">Result:</h4>
                    <ScrollArea className="h-48 w-full rounded border p-2 bg-muted">
                      <pre className="text-xs whitespace-pre-wrap">
                        {formatJson(results[endpoint.name])}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input 
                  id="apiKey" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Your BetsAPI key"
                />
              </div>
              
              <div>
                <Label htmlFor="customUrl">Custom BetsAPI URL</Label>
                <Input 
                  id="customUrl" 
                  value={customUrl} 
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="e.g. https://api.betsapi.com/v1/events/inplay"
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a complete BetsAPI URL to test (token will be added automatically)
                </p>
              </div>
              
              <Button 
                onClick={testCustomUrl}
                disabled={customLoading || !customUrl}
                className="w-full"
              >
                {customLoading ? 'Testing...' : 'Test Custom URL'}
              </Button>
              
              {customError && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded">
                  <h4 className="font-semibold text-destructive">Error:</h4>
                  <p>{customError}</p>
                </div>
              )}
              
              {customResponse && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Response:</h4>
                  <ScrollArea className="h-64 w-full rounded border p-2 bg-muted">
                    <pre className="text-xs whitespace-pre-wrap">
                      {formatJson(customResponse)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}