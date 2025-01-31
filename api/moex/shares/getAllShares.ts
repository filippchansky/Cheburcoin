import { apiMoex } from "../instance"


export const getAllShares = async() => {
    const { data } = await apiMoex.get('iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off')
    return data
}