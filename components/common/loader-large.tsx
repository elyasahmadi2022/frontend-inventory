export default function Loader() {
    return (
      <span
        className="
          relative
          inline-block
          h-12
          w-12
          animate-spin
          rounded-full
          border-2
          border-white
  
          before:absolute
          before:left-0
          before:top-0
          before:h-1.5
          before:w-1.5
          before:translate-x-[150%]
          before:translate-y-[150%]
          before:rounded-full
          before:bg-orange-600
          before:content-['']
  
          after:absolute
          after:bottom-0
          after:right-0
          after:h-1.5
          after:w-1.5
          after:-translate-x-[150%]
          after:-translate-y-[150%]
          after:rounded-full
          after:bg-orange-600
          after:content-['']
        "
      />
    );
  }