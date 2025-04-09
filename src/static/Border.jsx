

export default function Border({ children, className = "" }) {
  return <div className={`border-2 border-dashed border-gray-300 rounded-md p-6 ${className}`}>{children}</div>
}

