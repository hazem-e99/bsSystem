'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TripsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Trips Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Trip Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the trips management page. Content will be added here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
