import { Outlet, Navigate } from "react-router-dom";
import { useAuthStatus } from "../hooks/useAuthStatus";
import { Dna } from "react-loader-spinner";

//import Spinner from "./Spinner";
export default function PrivateRoute() {
  const { loggedIn, checkingStatus } = useAuthStatus();
  if (checkingStatus) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Dna
          visible={true}
          height="500"
          width="500"
          ariaLabel="dna-loading"
          wrapperStyle={{}}
          wrapperClass="dna-wrapper"
        />
      </div>
    );
  }
  return loggedIn ? <Outlet /> : <Navigate to="/sign-in" />;
}
