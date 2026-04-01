import dynamic from 'next/dynamic';

const PkeApp = dynamic(() => import('../client/src/App.js'), {
  ssr: false
});

export default function CatchAllPage() {
  return <PkeApp />;
}
