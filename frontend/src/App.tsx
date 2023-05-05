import { BrowserRouter, Link } from "react-router-dom";
import {
  Route,
  Routes,
  useLocation,
  Navigate,
  useParams,
  useNavigate,
} from "react-router";
import { useQuery, QueryClient, QueryClientProvider } from "react-query";
import { RegisterOptions, useForm } from "react-hook-form";
import { useRef, useState } from "react";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  dob: string;
  weight: number;
  allergies: string;
  medications: string;

  createdAt: string;
  updatedAt: string;
}

interface SearchValue {
  full_name?: string,
  email?: string,
  allergies?: string,
  medications?: string
}

function apiUrl(path: string): string {
  return `http://localhost:3000/api/${path}`;
}

function cn(...args: (string | false | null | undefined)[]): string {
  return args.filter((x) => !!x).join(" ");
}

function Patients() {
  const [sort, setSort] = useState<{
    field: keyof Patient;
    direction: "asc" | "desc";
  }>();

  const inputEl = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<SearchValue>({});

  const { register, reset, handleSubmit } = useForm<SearchValue>();

  const patients = useQuery(["patients", sort, search], async () => {
    let url = apiUrl("patients");

    const params = new URLSearchParams();

    if (sort) {
      params.append("sortBy", sort.field);
      params.append("direction", sort.direction);
    }

    if (search.full_name) {
      params.append("fullNameTerm", search.full_name);
    }

    if (search.email) {
      params.append("emailTerm", search.email);
    }

    if (search.allergies) {
      params.append("allergiesTerm", search.allergies);
    }

    if (search.medications) {
      params.append("medicationsTerm", search.medications);
    }

    const paramString = params.toString();

    if (paramString) {
      url += '?' + paramString;
    }

    const res = await fetch(url);
    return (await res.json()) as Patient[];
  });

  function column(field: keyof Patient) {
    const icon = (
      <svg
        onClick={() =>
          setSort((s) => {
            if (!s || s.field !== field) {
              return { field, direction: "asc" };
            } else if (s.direction === "asc") {
              return {
                field,
                direction: "desc",
              };
            } else {
              return undefined;
            }
          })
        }
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={cn(
          "w-6 h-6 border-2 rounded-[50%]",
          sort?.field === field
            ? "opacity-100 border-black/50"
            : "border-transparent opacity-10 hover:opacity-80",
          sort?.field === field && sort?.direction === "desc" && "rotate-180"
        )}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
        />
      </svg>
    );
    return (
      <th className="" key={field}>
        <div className="flex justify-between w-full">
          {field} {icon}
        </div>
      </th>
    );
  }

  function field<N extends keyof SearchValue>(name: N) {
    return (
      <label className="grid">
        <span className="text-sm text-gray-800">{name}</span>
        <input type="text" className="p-2 border rounded" {...register(name)} />
      </label>
    );
  }

  return (<div className="grid gap-2 grid-cols-1">
    <div>
      <span className="text-lg">Filters</span>
      <form className="flex gap-2 items-end wrap" onSubmit={handleSubmit(val => setSearch(val))}>
        {field("full_name")}
        {field("email")}
        {field("medications")}
        {field("allergies")}
        <button className={cn("bg-gray-100 border p-2 rounded h-[42px] w-24")}>
          Filter
        </button>
        <button type="submit" className={cn("bg-gray-100 border p-2 rounded h-[42px] w-24")} onClick={() => {
          reset();
        }}>
          Clear
        </button>
      </form>
    </div>
    <table className="table-auto w-full">
      <thead>
        <tr>
          {(
            [
              "id",
              "full_name",
              "email",
              "dob",
              "weight",
              "allergies",
              "medications",
              "createdAt",
              "updatedAt",
            ] as const
          ).map(column)}
          <th />
        </tr>
      </thead>

      {patients.status === "error" && <div>Failed to fetch patients</div>}

      {(patients.status === "loading" || patients.status === "idle") && (
        <tbody>
          {Array.from({ length: 3 }).map((_, i) => (
            <tr>
              {Array.from({ length: 9 }).map((_, j) => (
                <td>
                  <span className="rounded-md animate-pulse bg-gray-200 text-transparent">
                    {new Array(
                      Math.round(Math.abs(Math.sin(1000 * i * 9 + j)) * 20) + 8
                    ).fill(".")}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )}

      {patients.status === "success" && (
        <tbody>
          {patients.data.map((x) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.full_name}</td>
              <td>{x.email}</td>
              <td>{x.dob}</td>
              <td>{x.weight}</td>
              <td>{x.allergies}</td>
              <td>{x.medications}</td>
              <td>{x.createdAt}</td>
              <td>{x.updatedAt}</td>
              <td>
                <Link
                  className="text-blue-500 font-bold"
                  to={`/patient/${x.id}`}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      )}
    </table>
  </div>);
}

function Patient() {
  const { patientId } = useParams<{ patientId: string }>();

  const patient = useQuery(["patient", patientId], async () => {
    const res = await fetch(apiUrl("patient/" + patientId));

    return (await res.json()) as Patient;
  });

  if (!patient.data) {
    if (patient.isLoading) {
      return (
        <div>
          <div className="animate-pulse bg-gray-200 w-8 h-6"></div>
        </div>
      );
    }

    return <div>Failed to load patient</div>;
  }

  const p = patient.data;

  function field<N extends keyof Patient>(name: N) {
    return (
      <label className="grid">
        <span className="text-sm text-gray-800">{name}</span>
        <div className="p-2 border rounded">{p[name]}</div>
      </label>
    );
  }

  return (
    <div>
      <h1 className="font-bold text-2xl mt-4">{p.full_name}</h1>
      <h2 className="text-gray-800 my-1">ID: {p.id}</h2>

      <div className="grid gap-2 max-w-[600px] w-full">
        {field("full_name")}
        {field("email")}
        {field("dob")}
        {field("weight")}
        {field("allergies")}
        {field("medications")}
        {field("createdAt")}
        {field("updatedAt")}
      </div>
    </div>
  );
}

function NewPatient() {
  const navigate = useNavigate();

  const {
    register,
    formState: { errors, isLoading },
    handleSubmit,
  } = useForm<Patient>({ mode: "onBlur" });

  function field<N extends keyof Patient>(
    name: N,
    type: string,
    options?: RegisterOptions<Patient, N>
  ) {
    return (
      <label className="grid">
        <span className="text-sm text-gray-800">{name}</span>
        <input
          className={cn("border rounded p-2", errors[name] && "border-red-500")}
          step={type === 'number' ? '0.01' : undefined}
          type={type}
          {...register(name, options)}
        />
        {errors[name] && (
          <span className="text-sm text-red-500">
            {errors[name]?.message || errors[name]?.type}
          </span>
        )}
      </label>
    );
  }

  return (
    <div>
      <h1 className="font-bold text-2xl my-4">New Patient</h1>

      <form
        className={cn(
          "grid gap-2 max-w-[600px] w-full",
          isLoading && "opacity-80"
        )}
        onSubmit={handleSubmit(async (x) => {
          const response = await fetch(apiUrl(`patients`), {
            method: "POST",
            body: JSON.stringify({
              ...x,
              weight: x.weight ? Number(x.weight) : undefined,
            }),
            headers: {
              ["content-type"]: "application/json",
            },
          });

          const { id } = await response.json();

          navigate(`/patient/${id}`);
        })}
      >
        {field("full_name", "text", {
          required: "full_name is required",
        })}
        {field("email", "email", {
          required: "email is required",
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "Entered value does not match email format",
          },
        })}
        {field("dob", "date", {
          required: "dob is required",
          valueAsDate: true,
        })}
        {field("weight", "number", {
          validate: (x) => {
            if (!!x && isNaN(Number(x))) {
              return "weight is not a valid number";
            } else {
              return undefined;
            }
          },
        })}
        {field("allergies", "text")}
        {field("medications", "text")}
        <button className={cn("bg-gray-100 border p-2 rounded")}>
          {isLoading ? "Submitting" : "Submit"}
        </button>
      </form>
    </div>
  );
}

function Nav() {
  const { pathname } = useLocation();

  function args(to: string) {
    return {
      to,
      className: cn(
        "py-1 px-4 border rounded",
        pathname === to ? "bg-gray-100" : "hover:bg-gray-50"
      ),
    };
  }

  return (
    <nav className="flex gap-2 mb-2">
      <Link {...args("/patients")}>Patients</Link>
      <Link {...args("/patient/new")}>New Patient</Link>
    </nav>
  );
}

const DEFAULT_QUERY_CLIENT = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={DEFAULT_QUERY_CLIENT}>
      <div className="p-2">
        <BrowserRouter>
          <Nav />

          <Routes>
            <Route path="/patient/new" element={<NewPatient />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patient/:patientId" element={<Patient />} />
            <Route path="*" element={<Navigate to="/patients" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
