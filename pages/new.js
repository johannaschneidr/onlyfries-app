import Navbar from '../components/navbar';
import PostForm from '../components/postform';

export default function NewPost() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-6xl font-bold font-rouge-script text-center mb-6 text-white" style={{ lineHeight: '0.9' }}>
          These fries <span style={{ color: 'var(--light-blue-custom)' }}>hot</span> enough?
        </h1>
        <PostForm />
      </main>
    </>
  );
} 