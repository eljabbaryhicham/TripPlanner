import * as React from 'react';

const PageMessage = ({ icon, title, message }: { icon: React.ReactNode, title: string, message: string }) => (
    <div className="text-center py-20 space-y-4">
        <div className="inline-block p-4 bg-muted rounded-full">
            {icon}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-foreground/80 max-w-md mx-auto">{message}</p>
    </div>
);

export default PageMessage;
