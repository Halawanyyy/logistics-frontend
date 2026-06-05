import { apiClient } from '../../../shared/api/axios'
import type {
  CreateDriverRequest,
  DeleteDriverResponse,
  DriverCashExpectedResponse,
  DriverFilters,
  DriverManifestResponse,
  DriverResponse,
  DriverShipmentsResponse,
  DriversListResponse,
  UpdateDriverRequest,
} from '../types/driver.types'
import type { DriverCashClosureResponse, GenerateDriverCashClosureRequest } from '../../finance/types/finance.types'

export async function listDrivers() {
  const response = await apiClient.get<DriversListResponse>('/drivers')
  return response.data
}

export async function createDriver(payload: CreateDriverRequest) {
  const response = await apiClient.post<DriverResponse>('/drivers', payload)
  return response.data
}

export async function getDriver(driverId: string | number) {
  const response = await apiClient.get<DriverResponse>(`/drivers/${driverId}`)
  return response.data
}

export async function updateDriver(driverId: string | number, payload: UpdateDriverRequest) {
  const response = await apiClient.put<DriverResponse>(`/drivers/${driverId}`, payload)
  return response.data
}

export async function deleteDriver(driverId: string | number) {
  const response = await apiClient.delete<DeleteDriverResponse>(`/drivers/${driverId}`)
  return response.data
}

export async function listDriverShipments(driverId: string | number) {
  const response = await apiClient.get<DriverShipmentsResponse>(`/drivers/${driverId}/shipments`)
  return response.data
}

export async function getDriverManifest(driverId: string | number, params?: DriverFilters) {
  const response = await apiClient.get<DriverManifestResponse>(`/drivers/${driverId}/manifest`, {
    params,
  })
  return response.data
}

export async function getDriverCashExpected(driverId: string | number) {
  const response = await apiClient.get<DriverCashExpectedResponse>(
    `/drivers/${driverId}/cash-expected`,
  )
  return response.data
}

export async function generateDriverCashClosure(
  driverId: string | number,
  payload: GenerateDriverCashClosureRequest,
) {
  const response = await apiClient.post<DriverCashClosureResponse>(
    `/drivers/${driverId}/cash-closures/generate`,
    payload,
  )
  return response.data
}
