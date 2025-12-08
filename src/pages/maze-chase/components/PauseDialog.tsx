import React from "react";
import { useNavigate } from "react-router-dom";

interface PauseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onRestart: () => void;
}

const PauseDialog: React.FC<PauseDialogProps> = ({
  isOpen,
  onClose,
  onResume,
  onRestart,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleMainMenu = () => {
    navigate("/");
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />

      {/* Import Gothic Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=UnifrakturMaguntia&family=Grenze+Gotisch:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          .font-gothic {
            font-family: 'Pirata One', cursive;
            letter-spacing: 0.05em;
          }
          
          .font-body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-gray-800 border-2 border-[#c9a961] rounded-xl p-8 w-80 shadow-2xl backdrop-blur-md">
          <h2 className="font-gothic text-3xl text-[#c9a961] text-center mb-8">
            PAUSED
          </h2>

          <div className="flex flex-col gap-4">
            {/* Resume Button */}
            <button
              onClick={onResume}
              className="font-gothic w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Resume
            </button>

            {/* Restart Button */}
            <button
              onClick={onRestart}
              className="font-gothic w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Restart
            </button>

            {/* Main Menu Button */}
            <button
              onClick={handleMainMenu}
              className="font-gothic w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PauseDialog;
