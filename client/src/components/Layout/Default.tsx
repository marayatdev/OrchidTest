import Navbar from "./Navbar";
import { ReactNode } from "react";

interface DefaultUiComponentProps {
    children: ReactNode;
}

const DefaultUiComponent = ({ children }: DefaultUiComponentProps) => {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
            <Navbar />

            <div className="flex-1 bg-white rounded-t-3xl shadow-inner mt-[0.5rem] p-8 max-w-7xl w-full mx-auto">
                {children}
            </div>
        </main>
    );
};

export default DefaultUiComponent;
