/**
 * Qryx Setup Page - SIMPLIFIED VERSION
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function QryxSetupPage({
  searchParams,
}: {
  searchParams: { shop?: string };
}) {
  const shop = searchParams?.shop || 'no-shop';

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: 'white',
      padding: '40px',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Qryx Setup</h1>
      <p style={{ fontSize: '18px', color: '#94a3b8' }}>Shop: {shop}</p>
      <div style={{ marginTop: '40px' }}>
        <a 
          href="/login" 
          style={{ 
            backgroundColor: '#06b6d4', 
            color: 'black', 
            padding: '12px 24px', 
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Continue to Login
        </a>
      </div>
    </div>
  );
}
