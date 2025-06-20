import React, { useState, useEffect } from "react";
import axios from "axios";
import axiosInstance from "../../utils/axios";
import ClassInfo from "./ClassInfo";

const TrainCard = ({ train }) => {
  const [isListing, setIsListing] = useState(false);
  const [listingError, setListingError] = useState(null);
  const [listingSuccess, setListingSuccess] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [unlistSuccess, setUnlistSuccess] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    const checkUserListing = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axiosInstance.get('/api/users/me');
        
        if (response.data.success) {
          setUserData(response.data.user);
            const travelStatus = response.data.user.travelStatus;
          if (travelStatus && 
              travelStatus.isActive && 
              travelStatus.boardingStation === train.fromStation?.code && 
              travelStatus.destinationStation === train.toStation?.code && 
              travelStatus.trainNumber === train.trainNumber) {
            
            // Parse train date from DD-MM-YYYY format
            let trainDate;
            if (train.train_date) {
              const dateParts = train.train_date.split('-');
              if (dateParts.length === 3) {
                trainDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
              } else {
                trainDate = new Date(train.train_date);
              }
            } else {
              trainDate = new Date();
            }
            
            const userDate = new Date(travelStatus.travelDate);
            
            // Compare dates by converting both to date strings (YYYY-MM-DD)
            if (trainDate.toDateString() === userDate.toDateString()) {
              setIsListed(true);
              setListingSuccess(true);
              if (travelStatus.preferredClass) {
                setSelectedClass(travelStatus.preferredClass);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking user listing:", error);
      }
    };

    checkUserListing();
  }, [train]);

  const handleClassSelect = (classType) => {
    setSelectedClass(classType);
  };

  const handleListYourself = async () => {
    if (isListed) {
      await performListingAction();
      return;
    }
    
    if (!selectedClass) {
      setListingError("Please select a travel class before listing yourself");
      return;
    }
    
    await performListingAction();
  };
  
  const performListingAction = async () => {
    setIsListing(true);
    setListingError(null);
    setUnlistSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setListingError("Please login to list yourself on this train");
        setIsListing(false);
        return;
      }

      if (isListed) {
        const travelStatusData = {
          boardingStation: "",
          destinationStation: "",
          travelDate: null,
          trainNumber: "",
          preferredClass: "",
          isActive: false
        };

        const response = await axiosInstance.put(
          '/api/users/travel-status',
          travelStatusData
        );
        if (response.data.success) {
          setIsListed(false);
          setListingSuccess(false);
          setUnlistSuccess(true);
          setTimeout(() => {
            setUnlistSuccess(false);
          }, 3000);
        } else {
          setListingError("Failed to unlist from this train");
        }      } else {
        let trainDate;
        try {
          // Parse the train_date which comes in DD-MM-YYYY format
          if (train.train_date) {
            // If it's in DD-MM-YYYY format, convert to ISO string
            const dateParts = train.train_date.split('-');
            if (dateParts.length === 3) {
              // Create date from DD-MM-YYYY -> YYYY-MM-DD
              trainDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            } else {
              trainDate = new Date(train.train_date);
            }
          } else {
            trainDate = new Date();
          }
        } catch (error) {
          console.error('Error parsing train date:', error);
          trainDate = new Date();
        }

        const travelStatusData = {
          boardingStation: train.fromStation?.code || train.from,
          destinationStation: train.toStation?.code || train.to,
          travelDate: trainDate.toISOString(), // Convert to ISO string for proper backend handling
          trainNumber: train.trainNumber || train.train_number,
          preferredClass: selectedClass,
          isActive: true
        };

        const response = await axiosInstance.put(
          '/api/users/travel-status',
          travelStatusData
        );
        if (response.data.success) {
          setIsListed(true);
          setListingSuccess(true);
        } else {
          setListingError("Failed to list yourself on this train");
        }
      }
    } catch (error) {
      console.error('Error updating travel status:', error);
      setListingError(
        error.response?.data?.message || 
        "An error occurred. Please try again."
      );    } finally {
      setIsListing(false);
    }
  };

  return (<li
      key={train.trainNumber || train.train_number}
      className="bg-white/70 backdrop-blur-sm p-3 md:p-6 rounded-xl border border-gray-300/50 shadow-sm hover:shadow-md transition-all mt-2 md:mt-4 relative"
    >      {/* Ribbon for listed status */}
      {isListed && listingSuccess && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg font-medium text-sm z-10">
          You're Listed
        </div>
      )}<div className="flex justify-between items-start mb-2 md:mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-0.5 md:mb-1 flex items-center">
          <span className="mr-2">{train.trainName || train.train_name}</span>
          <span className="text-blue-600 font-medium text-sm md:text-base">
            ({train.trainNumber || train.train_number})
          </span>
        </h3>
        <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600">
          <span className="bg-blue-100 text-blue-700 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
            {train.train_date}
          </span>
        </div>
      </div><div className="flex justify-between items-center mb-1 md:mb-2">
        <div className="space-y-0.5 md:space-y-1">
          <p className="font-bold text-gray-900 text-base md:text-lg">
            <span className="hidden md:inline">
              {train.fromStation?.name || train.from_station_name} 
              <span className="text-gray-600 ml-1">({train.fromStation?.code || train.from})</span>
            </span>
            <span className="md:hidden">
              {train.fromStation?.code || train.from}
            </span>
          </p>
          <div className="text-xs md:text-sm text-gray-600">
            <p className="font-medium">{train.departureTime || train.from_std}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mt-0.5 md:mt-1 bg-gray-100 px-1.5 md:px-2 py-0.5 rounded">
              {train.duration ? `${Math.floor(train.duration / 60)}h ${train.duration % 60}m` : 'N/A'}
            </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div className="w-24 h-0.5 bg-blue-300"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          {train.distance && (
            <div className="text-xs text-gray-500 mt-0.5 md:mt-1 bg-gray-100 px-1.5 md:px-2 py-0.5 rounded">
              {train.distance} km
            </div>
          )}
        </div>

        <div className="space-y-0.5 md:space-y-1 text-right">
          <p className="font-bold text-gray-900 text-base md:text-lg">
            <span className="hidden md:inline">
              {train.toStation?.name || train.to_station_name} 
              <span className="text-gray-600 ml-1">({train.toStation?.code || train.to})</span>
            </span>
            <span className="md:hidden">
              {train.toStation?.code || train.to}
            </span>
          </p>
          <div className="text-xs md:text-sm text-gray-600">
            <p className="font-medium">{train.arrivalTime || train.to_sta}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <ClassInfo 
          train={train}
          selectedClass={selectedClass}
          onClassSelect={handleClassSelect}
        />
      </div>      
      <div className="flex justify-center">        {isListed && listingSuccess ? (
          <div className="flex flex-col items-center w-full">
            <div className="text-green-600 font-medium mb-2 md:mb-3 text-center text-sm md:text-base">
              You are listed on this train in 
              <span className="font-bold text-green-700"> {selectedClass} </span> 
              class! Fellow travelers can find you.
            </div>
            <button
              onClick={handleListYourself}
              disabled={isListing}
              className="bg-red-600 text-white font-semibold px-6 md:px-8 py-2 md:py-3 rounded-lg hover:bg-red-700 transition-all disabled:bg-red-300 w-full max-w-xs text-sm md:text-base"
            >
              {isListing ? "Processing..." : "Unlist Yourself"}
            </button>
          </div>
        ) : unlistSuccess ? (
          <div className="text-blue-600 font-medium py-2 md:py-3 px-3 md:px-4 bg-blue-50 rounded-lg border border-blue-200 text-sm md:text-base">
            You have been unlisted from this train successfully!
          </div>
        ) : selectedClass ? (
          <button
            onClick={handleListYourself}
            disabled={isListing}
            className="mt-2 md:mt-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-md font-semibold px-6 md:px-8 py-2 md:py-3 rounded-lg transition-all w-full max-w-xs text-sm md:text-base"
          >
            {isListing ? "Processing..." : "List Yourself on This Train"}
          </button>
        ) : null}
      </div>      {listingError && (
        <div className="mt-2 md:mt-3 text-red-600 text-center bg-red-50 py-2 px-4 rounded-lg border border-red-200 text-sm md:text-base">
          {listingError}
        </div>
      )}
    </li>
  );
};

export default TrainCard;