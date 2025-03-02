import '@/App.css';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { EmailList } from '@/components/email-list';
import { EmailLabels } from '@/components/email-labels';
import { AuthProvider } from '@/auth/auth-context';
import AuthGuard from '@/auth/AuthGuard';
import { GmailProvider } from '@/contexts/gmail-context';
import LogoutButton from '@/components/LogoutButton';
import WailsDemo from './WailsDemo';

function EmailApp() {
  return (
    <main className='container'>
      <SidebarProvider
        style={
          {
            '--sidebar-width': '350px',
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <header className='sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href='#'>All Inboxes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>Inbox</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className='ml-auto'>
              <LogoutButton />
            </div>
          </header>
          <div className='flex flex-1'>
            <div className='w-64 border-r'>
              <EmailLabels />
            </div>
            <div className='flex-1'>
              <EmailList />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      {/* <WailsDemo /> */}
      <AuthGuard>
        <GmailProvider>
          <EmailApp />
        </GmailProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
