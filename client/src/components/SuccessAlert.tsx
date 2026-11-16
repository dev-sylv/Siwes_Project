export default function SuccessAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
      {message}
    </div>
  );
}
