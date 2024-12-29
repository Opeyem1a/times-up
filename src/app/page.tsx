"use client"
import Image from "next/image";
import { useSearchParams } from 'next/navigation'
import {use, useEffect, useState} from "react";

type SlideTime = {name:string; time:number}
export default function Home() {
  const searchParams = useSearchParams()
  const json_string = searchParams.get('data') ?? "{}"
  const slides_json:[string,string][] = Object.entries(JSON.parse(json_string))
  const slides_obj_arr: SlideTime[] = []
    for(const [name, time] of slides_json){
      slides_obj_arr.push({name, time: parseFloat(time)})
    }
    const warning_time = parseFloat(searchParams.get('warning') ?? "0")

    const [slide_index, set_slide_index] = useState(0);
    console.log(slide_index)
    const [current_time, set_current_time] = useState(slides_obj_arr[0].time*60)
    useEffect(()=>{
        const interval = setInterval(() => set_current_time((prev)=> prev -1),1000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        if(current_time <=-1){
            set_slide_index((curr)=> curr +1)
            set_current_time(slides_obj_arr[slide_index+1].time*60)
        }
    }, [current_time])

    return (
      <>
      <p>hello</p>
          <Display current_time={current_time} slide_name={"name"}></Display>
      </>
    )
}


type TimerProps = {current_time: number, slide_name: string}
function Display(props: TimerProps){
    const current_time = props.current_time;
    const slide_name = props.slide_name;
    return(
        <div>
        <p>{current_time}</p>
            <p>{slide_name}</p>
        </div>
    )
}


